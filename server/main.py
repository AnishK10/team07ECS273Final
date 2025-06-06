from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from geopy.distance import geodesic
from TaxiDemandPredictor import TaxiDemandPredictor
import pandas as pd
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# I have loaded the zone centroids and lookup data

zone_centroids_df = pd.read_csv("data/zone_centroids_wgs84new.csv")
zone_lookup_df = pd.read_csv("data/taxi_zones.csv")
print(zone_lookup_df.head())

predictor = TaxiDemandPredictor(
    lstm_model_path="models/global_lstm.pt",
    xgb_model_path="models/global_xgb.pkl",
    scaler_path="models/scaler.pkl",
)

class CoordRequest(BaseModel):
    latitude: float
    longitude: float
    datetime_str: str

@app.get("/")
def home():
    return {"message": " NYC Taxi Demand Prediction API is live!"}

@app.post("/predict_by_coordinates")
def predict_by_coordinates(req: CoordRequest):
    try:
        zone_dists = zone_centroids_df.copy()
        zone_dists['distance'] = zone_dists.apply(
            lambda row: geodesic((req.latitude, req.longitude), (row['lat'], row['lon'])).meters,
            axis=1
        )
        # Top nearest 3 zones 
        nearest_zones = zone_dists.nsmallest(3, 'distance')

        response = {
            "coordinates": {"lat": req.latitude, "lon": req.longitude},
            "datetime": req.datetime_str,
            "nearest_zones": []
        }

        for _, row in nearest_zones.iterrows():
            zone_id = int(row["PULocationID"])
            pred = predictor.predict_with_intervals(zone_id, req.datetime_str)

            filtered_pred = {k: v for k, v in pred.items() if k in ["-30min", "+0min", "+30min"]}

            lookup = zone_lookup_df[zone_lookup_df['LocationID'] == zone_id].iloc[0]
            zone_name = lookup['zone']
            borough = lookup['borough']

            response["nearest_zones"].append({
                "zone_id": zone_id,
                "zone_name": zone_name,
                "borough": borough,
                "distance_meters": round(row["distance"], 2),
                "predictions": filtered_pred
            })

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coordinate-based prediction failed: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
