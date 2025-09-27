import sys
import numpy as np
import json
import os

# ===================================================================
# == SOLUTION: Add these two lines to suppress TensorFlow logs ==
# This must be done BEFORE importing TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
# ===================================================================

import tensorflow as tf
from tensorflow.keras.preprocessing import image

def preprocess_image(img_path):
    """
    Loads and preprocesses an image file to match the VGG19 model's input requirements.
    """
    img = image.load_img(img_path, target_size=(28, 28), color_mode='grayscale')
    img_array = image.img_to_array(img)
    
    img_tensor = tf.convert_to_tensor(img_array.reshape(1, 28, 28, 1))
    img_resized = tf.image.resize(img_tensor, (32, 32))
    img_rgb = tf.image.grayscale_to_rgb(img_resized)
    img_normalized = img_rgb / 255.0
    return img_normalized

def predict(image_path, model_path):
    """
    Loads the model, preprocesses the image, makes a prediction,
    and prints the result as a JSON string to standard output.
    """
    try:
        model = tf.keras.models.load_model(model_path)
        processed_image = preprocess_image(image_path)
        
        # We pass verbose=0 to the predict function to hide the progress bar
        prediction_array = model.predict(processed_image, verbose=0)
        
        predicted_digit = int(np.argmax(prediction_array))
        
        print(json.dumps({"digit": predicted_digit}))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Incorrect number of arguments."}), file=sys.stderr)
        sys.exit(1)
        
    image_path_arg = sys.argv[1]
    model_path_arg = sys.argv[2]
    predict(image_path_arg, model_path_arg)

