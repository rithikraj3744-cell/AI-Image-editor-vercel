"""
filters.py
OpenCV-based image filters used by the Flask API routes in app.py.

Every function takes a BGR numpy array (as read by cv2.imread / cv2.imdecode)
and returns a BGR numpy array of the same general shape, ready to be
re-encoded and sent back to the client.
"""

import cv2
import numpy as np


def to_grayscale(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)  # keep 3 channels for consistent encoding


def apply_blur(img, ksize=15):
    ksize = ksize if ksize % 2 == 1 else ksize + 1  # kernel must be odd
    return cv2.GaussianBlur(img, (ksize, ksize), 0)


def edge_detect(img, threshold1=100, threshold2=200):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, threshold1, threshold2)
    return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)


def pencil_sketch(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    inverted = 255 - gray
    blurred = cv2.GaussianBlur(inverted, (21, 21), 0)
    inverted_blur = 255 - blurred
    sketch = cv2.divide(gray, inverted_blur, scale=256.0)
    return cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)


def cartoonify(img):
    # Smooth color regions
    color = img
    for _ in range(2):
        color = cv2.bilateralFilter(color, d=9, sigmaColor=75, sigmaSpace=75)

    # Extract edges
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray_blur = cv2.medianBlur(gray, 7)
    edges = cv2.adaptiveThreshold(
        gray_blur, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY,
        blockSize=9, C=2
    )
    edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    return cv2.bitwise_and(color, edges_colored)


def sharpen(img):
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])
    return cv2.filter2D(img, -1, kernel)


def rotate(img, angle=90):
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

    cos = abs(matrix[0, 0])
    sin = abs(matrix[0, 1])
    new_w = int((h * sin) + (w * cos))
    new_h = int((h * cos) + (w * sin))
    matrix[0, 2] += (new_w / 2) - center[0]
    matrix[1, 2] += (new_h / 2) - center[1]

    return cv2.warpAffine(img, matrix, (new_w, new_h))


def flip(img, mode="horizontal"):
    flip_code = 1 if mode == "horizontal" else 0
    return cv2.flip(img, flip_code)


def adjust_brightness_contrast(img, brightness=0, contrast=0):
    """
    brightness, contrast: expected range roughly -100 to 100.
    """
    brightness = float(brightness)
    contrast = float(contrast)

    # Contrast factor: maps -100..100 to a multiplicative scale around 1.0
    factor = (259 * (contrast + 255)) / (255 * (259 - contrast)) if contrast != 0 else 1.0

    img = img.astype(np.float32)
    img = factor * (img - 128) + 128 + brightness
    img = np.clip(img, 0, 255).astype(np.uint8)
    return img
