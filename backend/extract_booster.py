import pickle
import pickletools

MODEL_PATH = "model/fire_classifier_model.pkl"

data = open(MODEL_PATH, "rb").read()

print("Model file size:", len(data))

for opcode, arg, pos in pickletools.genops(data):
    if opcode.name in ("BYTEARRAY8", "BINBYTES", "BINBYTES8", "SHORT_BINBYTES"):
        if arg is not None and len(arg) > 100000:
            print("Found large binary payload")
            print("Opcode:", opcode.name)
            print("Position:", pos)
            print("Payload size:", len(arg))

            with open("model/extracted_booster.bin", "wb") as f:
                f.write(arg)

            print("Saved to:")
            print("model/extracted_booster.bin")