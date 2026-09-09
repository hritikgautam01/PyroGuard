import xgboost as xgb

INPUT = "model/extracted_booster.bin"
OUTPUT = "model/fire_classifier_recovered.json"

data = open(INPUT, "rb").read()

booster = xgb.Booster()

booster.__setstate__({
    "handle": bytearray(data)
})

print("Booster recovered successfully")
print("Features:", booster.num_features())

booster.save_model(OUTPUT)

print("Saved recovered model to:")
print(OUTPUT)