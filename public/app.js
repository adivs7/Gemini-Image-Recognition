document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const captureButton = document.getElementById("captureButton");
  const uploadButton = document.getElementById("uploadButton");
  const imageInput = document.getElementById("imageInput");
  const spinner = document.getElementById("spinner");
  const resultDiv = document.getElementById("result");
  let stream;

  captureButton.addEventListener("click", async () => {
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam:", err);
        return;
      }
    }

    video.play();

    captureButton.textContent = "Snap";

    captureButton.addEventListener(
      "click",
      async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error("Failed to capture image from video.");
            return;
          }

          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

          const formData = new FormData();
          formData.append("image", file);

          spinner.style.display = "block";
          resultDiv.innerText = "";

          console.log("Uploading captured image...");
          const response = await fetch("/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          console.log("Received response:", result);

          spinner.style.display = "none";
          resultDiv.innerText = result.response;

          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
          stream = null;
          captureButton.textContent = "Capture";
        }, "image/jpeg");
      },
      { once: true }
    );
  });

  uploadButton.addEventListener("click", async () => {
    const file = imageInput.files[0];
    if (!file) return alert("Please select an image");

    const formData = new FormData();
    formData.append("image", file);

    spinner.style.display = "block";
    resultDiv.innerText = "";

    console.log("Uploading image...");
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("Received response:", result);

    spinner.style.display = "none";
    resultDiv.innerText = result.response;
  });
});
