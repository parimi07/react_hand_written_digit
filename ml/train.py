import tensorflow as tf
from tensorflow.keras.applications import VGG19
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Flatten, Dropout
from tensorflow.keras.datasets import mnist
import numpy as np
import os

print("Starting model training...")

# --- 1. Data Preprocessing ---
(x_train, y_train), (x_test, y_test) = mnist.load_data()

# Preprocessing function for VGG19
def preprocess_data(images):
    # Resize from 28x28 to 32x32
    images_resized = tf.image.resize(images[..., np.newaxis], (32, 32))
    # Convert grayscale to 3-channel RGB
    images_rgb = tf.image.grayscale_to_rgb(images_resized)
    # Normalize pixel values to [0, 1]
    return images_rgb / 255.0

print("Preprocessing data...")
x_train_processed = preprocess_data(x_train)
x_test_processed = preprocess_data(x_test)

# One-hot encode the labels
y_train_one_hot = tf.keras.utils.to_categorical(y_train, 10)
y_test_one_hot = tf.keras.utils.to_categorical(y_test, 10)

# --- 2. Build VGG19 Model ---
# Load VGG19 pre-trained on ImageNet, without the top classification layer
base_model = VGG19(weights='imagenet', include_top=False, input_shape=(32, 32, 3))

# Freeze the layers of the base model
base_model.trainable = False

# Add our custom classifier on top
x = Flatten()(base_model.output)
x = Dense(128, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(10, activation='softmax')(x)

# Create the final model
model = Model(inputs=base_model.input, outputs=predictions)

print("Model built. Compiling...")

# --- 3. Compile and Train ---
model.compile(optimizer='adam', 
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

print("Starting training...")
model.fit(x_train_processed, y_train_one_hot, 
          epochs=5, 
          batch_size=128, 
          validation_data=(x_test_processed, y_test_one_hot))

# --- 4. Save Model ---
# Ensure the path for saving is correct. This will save it in the same directory.
output_path = os.path.join(os.path.dirname(__file__), '../ml/mnist_vgg19.h5')

# Create the directory if it doesn't exist
os.makedirs(os.path.dirname(output_path), exist_ok=True)

model.save(output_path)
print(f"Model trained and saved successfully at: {output_path}")