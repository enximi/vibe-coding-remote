package com.enximi.voicebridge.ui

import android.content.Context
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.util.AttributeSet
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputConnectionWrapper
import android.widget.EditText

class KeyboardAwareEditText @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : EditText(context, attrs) {
    var enterToSend: Boolean = false
    var onSubmit: (() -> Unit)? = null
    var onEmptyBackspace: (() -> Unit)? = null

    private var lastFocusSignal: Int = Int.MIN_VALUE

    var focusSignal: Int = 0
        set(value) {
            field = value
            if (value != lastFocusSignal) {
                lastFocusSignal = value
                requestFocus()
                setSelection(text?.length ?: 0)
            }
        }

    init {
        setOnEditorActionListener { _, actionId, event ->
            val currentText = text?.toString().orEmpty()
            val isEnterDown = event?.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN

            when {
                actionId == EditorInfo.IME_ACTION_SEND -> {
                    onSubmit?.invoke()
                    true
                }
                isEnterDown && currentText.isBlank() -> {
                    onSubmit?.invoke()
                    true
                }
                isEnterDown && enterToSend && currentText.isNotBlank() -> {
                    onSubmit?.invoke()
                    true
                }
                else -> false
            }
        }
    }

    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
        val baseConnection = super.onCreateInputConnection(outAttrs) ?: return null

        return object : InputConnectionWrapper(baseConnection, true) {
            override fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean {
                if ((text?.isEmpty() != false) && beforeLength == 1 && afterLength == 0) {
                    onEmptyBackspace?.invoke()
                    return true
                }

                return super.deleteSurroundingText(beforeLength, afterLength)
            }

            override fun sendKeyEvent(event: KeyEvent): Boolean {
                if (event.action == KeyEvent.ACTION_DOWN &&
                    event.keyCode == KeyEvent.KEYCODE_DEL &&
                    text?.isEmpty() != false
                ) {
                    onEmptyBackspace?.invoke()
                    return true
                }

                return super.sendKeyEvent(event)
            }
        }
    }

    fun setCursorColor(color: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            textCursorDrawable = ColorDrawable(color)
        }
    }
}
