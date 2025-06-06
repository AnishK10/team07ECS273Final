# NYC Taxi Demand Predictor

This project is a full-stack interactive application that predicts NYC taxi demand at the zone level. It allows users to input a time and location to visualize expected taxi pickups across NYC on an interactive map, enhanced with demand level insights and trend charts.

The backend combines an LSTM-based time series forecaster with an XGBoost model on the residuals, trained using NYC TLC yellow taxi data. The frontend is built in React with D3.js and TailwindCSS, offering a seamless, intuitive interface.

---

##  Project Structure

```
nyc-taxi-demand-predictor/
├── server/        # FastAPI backend with ML models
├── client/        # React frontend with map and charts
├── README.md
```

## Data Source

This project uses publicly available NYC taxi trip data provided by the New York City Taxi and Limousine Commission (TLC):  
🔗 [NYC TLC Trip Record Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page)

---

### Clone the repository

```bash
git clone https://github.com/your-username/nyc-taxi-demand-predictor.git
cd nyc-taxi-demand-predictor
```

---

## Backend Setup (FastAPI + PyTorch + XGBoost)

```bash
cd server
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Ensure the following files are present inside the `server/` folder:
- `global_lstm.pt` – trained PyTorch LSTM model
- `global_xgb.pkl` – trained XGBoost model
- `scaler.pkl` – fitted MinMaxScaler
- `main.py` – FastAPI application
- `requirements.txt`

### Run the API server

```bash
uvicorn main:app --reload --port 8000
```

---

## Frontend Setup (React + Tailwind + D3.js)

```bash
cd client
npm install
npm run dev
```

---

##  Execution Flow

1. User enters a desired pickup time and address.
2. Nominatim geocodes the address to coordinates.
3. Coordinates and time are sent to FastAPI for prediction.
4. Backend returns demand predictions for nearest zones.
5. Demand values and trends are visualized using D3.js.

---

## Features

- Interactive NYC zone map with gradient-based demand coloring
- Search address and specify pickup time
- Time-series demand chart per selected zone
- User location detection and zoom
- FastAPI-based scalable prediction endpoint

## Disclaimer

Parts of this project involved the use of AI tools strictly for code refinement, clarification, and debugging — not for original code generation.

---




