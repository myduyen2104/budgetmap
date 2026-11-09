# Vietnamese handwriting OCR model

- Source: https://huggingface.co/vudang449/vietocr-vietnamese-handwriting
- Pinned source revision: `f1973b930f907c378f6e3152ce9d8658724b228a`
- License declared by the model card: Apache-2.0 (see `LICENSE`)
- Model type: line-level Vietnamese handwritten text recognition (ONNX, FP16)
- Files: `encoder_fp16.onnx`, `decoder_fp16.onnx`, `vocab.txt`

The model card reports 5.1% weighted character error rate on its 1,000-line
VietHTR test split. This is a line recognizer, not a full-page layout parser;
the app uses printed OCR line boxes to select the handwritten date and total
rows before recognition.
