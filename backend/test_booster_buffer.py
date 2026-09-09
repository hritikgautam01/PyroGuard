import ctypes
import xgboost as xgb

MODEL_PATH = "model/extracted_booster.bin"

data = open(MODEL_PATH, "rb").read()

print("XGBoost version:", xgb.__version__)
print("Buffer size:", len(data))

booster = xgb.Booster()

print("Trying Booster.__setstate__...")

try:
    booster.__setstate__({
        "handle": bytearray(data)
    })

    print("SUCCESS!")
    print("Number of features:", booster.num_features())

except Exception as e:
    print("FAILED")
    print(type(e).__name__)
    print(e)