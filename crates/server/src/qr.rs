use qrcode::{QrCode, render::unicode};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum QrError {
    #[error("failed to generate QR code: {0}")]
    Generate(#[from] qrcode::types::QrError),
}

pub fn render_qr_text(text: &str) -> Result<String, QrError> {
    let qr = QrCode::new(text.as_bytes())?;

    Ok(qr
        .render::<unicode::Dense1x2>()
        .quiet_zone(true)
        .module_dimensions(1, 1)
        .build())
}
