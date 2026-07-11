"""
app.py — AI Image Editor (Vercel-compatible version)

Vercel's serverless functions have no persistent filesystem, so this version
doesn't save history to disk. Instead, /apply just processes and returns the
image; the browser saves each result to localStorage (see static/js/app.js).
That means history is per-browser/per-device, not shared — which is fine for
a demo and avoids the crash you'd get trying to write files on Vercel.
"""

import io

import cv2
import numpy as np
from flask import Flask, request, send_file, jsonify, render_template

import filters

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB


def read_image_from_request():
    if "image" not in request.files:
        raise ValueError("No 'image' file in request.")
    file = request.files["image"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Is it a valid image file?")
    return img


def apply_filter(img, filter_name):
    if filter_name == "grayscale":
        return filters.to_grayscale(img)
    elif filter_name == "cartoon":
        return filters.cartoonify(img)
    elif filter_name == "blur":
        return filters.apply_blur(img, int(request.form.get("ksize", 15)))
    elif filter_name == "edge":
        return filters.edge_detect(img)
    elif filter_name == "sketch":
        return filters.pencil_sketch(img)
    elif filter_name == "sharpen":
        return filters.sharpen(img)
    elif filter_name == "rotate":
        return filters.rotate(img, float(request.form.get("angle", 90)))
    elif filter_name == "flip":
        return filters.flip(img, request.form.get("mode", "horizontal"))
    else:
        raise ValueError(f"Unknown filter: {filter_name}")


@app.errorhandler(ValueError)
def handle_value_error(err):
    return jsonify({"error": str(err)}), 400


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/apply", methods=["POST"])
def apply_route():
    img = read_image_from_request()
    filter_name = request.form.get("filter", "grayscale")

    result = apply_filter(img, filter_name)

    brightness = float(request.form.get("brightness", 0))
    contrast = float(request.form.get("contrast", 0))
    if filter_name != "edge" and (brightness != 0 or contrast != 0):
        result = filters.adjust_brightness_contrast(result, brightness, contrast)

    success, buffer = cv2.imencode(".png", result)
    if not success:
        raise ValueError("Could not encode result image.")

    return send_file(io.BytesIO(buffer.tobytes()), mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
