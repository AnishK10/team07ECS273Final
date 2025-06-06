import numpy as np
import torch
import torch.nn as nn
import pandas as pd
import joblib
from datetime import datetime, timedelta

class GlobalLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, temporal_size, zone_size):
        super(GlobalLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.dropout = nn.Dropout(0.2)
        self.fc1 = nn.Linear(hidden_size + temporal_size + zone_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        self.relu = nn.ReLU()

    def forward(self, x_seq, x_temp, x_zone):
        _, (hidden, _) = self.lstm(x_seq)
        lstm_out = self.dropout(hidden[-1])
        combined = torch.cat([lstm_out, x_temp, x_zone], dim=1)
        x = self.relu(self.fc1(combined))
        x = self.relu(self.fc2(x))
        return self.fc3(x)

class TaxiDemandPredictor:
    def __init__(self, lstm_model_path, xgb_model_path, scaler_path, historical_data_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sequence_length = 24

        self.lstm_model = GlobalLSTM(1, 50, 8, 1)
        self.lstm_model.load_state_dict(torch.load(lstm_model_path, map_location=self.device))
        self.lstm_model.to(self.device)
        self.lstm_model.eval()

        self.xgb_model = joblib.load(xgb_model_path)
        self.scaler = joblib.load(scaler_path)

        self.historical_data = None
        if historical_data_path:
            try:
                self.historical_data = pd.read_pickle(historical_data_path)
            except:
                print("⚠️ Could not load historical data")

    def extract_temporal_features(self, timestamp):
        return np.array([
            timestamp.hour,
            timestamp.weekday(),
            timestamp.day,
            timestamp.month,
            np.sin(2 * np.pi * timestamp.hour / 24),
            np.cos(2 * np.pi * timestamp.hour / 24),
            np.sin(2 * np.pi * timestamp.weekday() / 7),
            np.cos(2 * np.pi * timestamp.weekday() / 7),
        ])

    def generate_synthetic_sequence(self, zone_id, target_time):
        sequence = []
        for i in range(self.sequence_length):
            time_point = target_time - timedelta(hours=self.sequence_length - i)
            hour = time_point.hour
            if 6 <= hour <= 9:
                base_demand = 0.7 + np.random.normal(0, 0.1)
            elif 17 <= hour <= 20:
                base_demand = 0.8 + np.random.normal(0, 0.1)
            elif 22 <= hour or hour <= 3:
                base_demand = 0.4 + np.random.normal(0, 0.15)
            else:
                base_demand = 0.5 + np.random.normal(0, 0.1)
            if time_point.weekday() >= 5:
                base_demand *= 1.3 if hour >= 22 or hour <= 3 else 0.8
            zone_factor = 0.5 + (hash(str(zone_id)) % 100) / 200
            base_demand *= zone_factor
            sequence.append(max(0, min(1, base_demand)))
        return np.array(sequence)

    def get_historical_sequence(self, zone_id, target_time):
        if self.historical_data is not None:
            try:
                zone_data = self.historical_data.get(zone_id)
                if zone_data is not None:
                    return zone_data.tail(self.sequence_length).values
            except:
                pass
        return self.generate_synthetic_sequence(zone_id, target_time)

    def predict_single(self, zone_id, datetime_str):
        target_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
        sequence = self.get_historical_sequence(zone_id, target_time)
        temporal_features = self.extract_temporal_features(target_time)

        X_seq = torch.tensor(sequence, dtype=torch.float32).unsqueeze(0).unsqueeze(-1).to(self.device)
        X_temp = torch.tensor(temporal_features, dtype=torch.float32).unsqueeze(0).to(self.device)
        X_zone = torch.tensor([[float(zone_id)]], dtype=torch.float32).to(self.device)

        with torch.no_grad():
            lstm_pred = self.lstm_model(X_seq, X_temp, X_zone).squeeze().cpu().numpy()

        X_seq_flat = sequence.reshape(1, -1)
        X_temp_np = temporal_features.reshape(1, -1)
        X_zone_np = np.array([[zone_id]])
        X_xgb = np.hstack([X_seq_flat, X_temp_np, X_zone_np])
        residual_pred = self.xgb_model.predict(X_xgb)[0]

        final_pred_scaled = lstm_pred + residual_pred
        dummy_array = np.zeros((1, self.scaler.n_features_in_))
        dummy_array[0, min(zone_id, self.scaler.n_features_in_ - 1)] = final_pred_scaled
        denormalized = self.scaler.inverse_transform(dummy_array)
        final_pred = denormalized[0, min(zone_id, self.scaler.n_features_in_ - 1)]

        return max(0, final_pred)

    def predict_with_intervals(self, zone_id, datetime_str):
        base_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
        intervals = [-60, -30, -15, 0, 15, 30, 60]
        results = {}

        for interval in intervals:
            target_time = base_time + timedelta(minutes=interval)
            target_str = target_time.strftime("%Y-%m-%d %H:%M:%S")
            try:
                prediction = self.predict_single(zone_id, target_str)
                results[f"{interval:+d}min"] = {
                    "datetime": target_str,
                    "predicted_demand": round(prediction, 2)
                }
            except Exception as e:
                results[f"{interval:+d}min"] = {
                    "datetime": target_str,
                    "predicted_demand": f"Error: {str(e)}"
                }

        return results
