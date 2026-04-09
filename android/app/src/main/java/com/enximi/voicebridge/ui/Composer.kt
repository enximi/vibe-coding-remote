package com.enximi.voicebridge.ui

import android.content.Context
import android.graphics.Typeface
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.widget.doAfterTextChanged

@Composable
fun Composer(
    text: String,
    enterToSend: Boolean,
    focusSignal: Int,
    onTextChanged: (String) -> Unit,
    onSubmit: () -> Unit,
    onEmptyBackspace: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val textColor = MaterialTheme.colorScheme.onBackground.toArgb()
    val cursorColor = MaterialTheme.colorScheme.primary.toArgb()

    Box(modifier = modifier) {
        if (text.isEmpty()) {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier
                    .padding(top = 4.dp)
                    .fillMaxWidth(),
            ) {
                WatermarkText("这是一个把手机输入发送到电脑的小工具。")
                WatermarkText("先在电脑上把光标放到你想输入的位置，然后在这里输入文字，或直接使用手机输入法的语音输入。")
                WatermarkText("回车可以根据设置用于发送或换行；当输入框为空时，按退格会直接作用到电脑。底部按钮也可以帮助你发送换行、退格等常用操作。")
            }
        }

        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context: Context ->
                KeyboardAwareEditText(context).apply {
                    background = null
                    gravity = Gravity.TOP or Gravity.START
                    textSize = 20f
                    typeface = Typeface.DEFAULT
                    setLineSpacing(0f, 1.6f)
                    setHorizontallyScrolling(false)
                    maxLines = Int.MAX_VALUE
                    overScrollMode = android.view.View.OVER_SCROLL_NEVER
                    setPadding(0, 0, 0, 0)
                    isVerticalScrollBarEnabled = false

                    doAfterTextChanged { editable ->
                        val nextText = editable?.toString().orEmpty()
                        if (nextText != text) {
                            onTextChanged(nextText)
                        }
                    }
                }
            },
            update = { editText: KeyboardAwareEditText ->
                editText.enterToSend = enterToSend
                editText.onSubmit = onSubmit
                editText.onEmptyBackspace = onEmptyBackspace
                editText.focusSignal = focusSignal
                editText.setTextColor(textColor)
                editText.setCursorColor(cursorColor)
                editText.imeOptions = if (enterToSend && text.isNotBlank()) {
                    EditorInfo.IME_ACTION_SEND
                } else {
                    EditorInfo.IME_ACTION_NONE
                }

                if (editText.text?.toString() != text) {
                    editText.setText(text)
                    editText.setSelection(text.length)
                }
            },
        )
    }
}

@Composable
private fun WatermarkText(text: String) {
    Text(
        text = text,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
    )
}
