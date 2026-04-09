package com.enximi.voicebridge.ui

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Backspace
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun Dock(
    onSettingsClick: () -> Unit,
    showCopy: Boolean,
    showPaste: Boolean,
    showTab: Boolean,
    showNewline: Boolean,
    showBackspace: Boolean,
    onTab: () -> Unit,
    onCopy: () -> Unit,
    onPaste: () -> Unit,
    onBackspace: () -> Unit,
    onNewline: () -> Unit,
    onSend: () -> Unit,
    canSend: Boolean,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(horizontal = 8.dp)
            .padding(bottom = 8.dp)
            .shadow(
                elevation = 16.dp,
                shape = RoundedCornerShape(999.dp),
                clip = false
            )
            .background(
                color = MaterialTheme.colorScheme.surfaceColorAtElevation(8.dp).copy(alpha = 0.82f),
                shape = RoundedCornerShape(999.dp)
            )
    ) {
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            DockButton(
                icon = Icons.Rounded.Settings,
                onClick = onSettingsClick
            )

            if (showCopy) {
                DockButton(
                    icon = Icons.Rounded.ContentCopy,
                    onClick = onCopy
                )
            }

            if (showPaste) {
                DockButton(
                    icon = Icons.Rounded.ContentPaste,
                    onClick = onPaste
                )
            }

            if (showTab) {
                DockButton(
                    icon = Icons.Rounded.KeyboardTab,
                    onContinuousTrigger = onTab
                )
            }

            if (showNewline) {
                DockButton(
                    icon = Icons.Rounded.KeyboardReturn,
                    onContinuousTrigger = onNewline
                )
            }

            if (showBackspace) {
                DockButton(
                    icon = Icons.AutoMirrored.Rounded.Backspace,
                    onContinuousTrigger = onBackspace
                )
            }

            VerticalDivider(
                modifier = Modifier
                    .height(28.dp)
                    .alpha(0.2f),
                color = MaterialTheme.colorScheme.onSurface
            )

            SendButton(
                onClick = onSend,
                enabled = canSend
            )
        }
    }
}

@Composable
fun DockButton(
    icon: ImageVector,
    onClick: (() -> Unit)? = null,
    onContinuousTrigger: (() -> Unit)? = null
) {
    var isPressed by remember { mutableStateOf(false) }
    var triggerCount by remember { mutableIntStateOf(0) }
    var displayCount by remember { mutableIntStateOf(0) }
    
    val scale = remember { Animatable(1f) }
    val bumpScale = remember { Animatable(1f) }

    LaunchedEffect(displayCount) {
        if (displayCount > 1) {
            bumpScale.snapTo(1f)
            bumpScale.animateTo(1.3f, tween(75))
            bumpScale.animateTo(1f, spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessMedium))
        }
    }
    val view = LocalView.current
    val coroutineScope = rememberCoroutineScope()

    // Outer box without clipping strictly to allow animated overlays to escape bounds
    Box(
        modifier = Modifier.size(42.dp),
        contentAlignment = Alignment.Center
    ) {
        // Inner box handles hit testing, ripples, and clipped background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(if (isPressed) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f) else Color.Transparent)
                .pointerInput(Unit) {
                    awaitEachGesture {
                        awaitFirstDown(requireUnconsumed = false)
                        isPressed = true
                        triggerCount = 1
                        displayCount = 1

                        // Animate down to 0.85 exactly matching web :active
                        coroutineScope.launch {
                            scale.animateTo(0.85f, tween(100))
                        }

                        var continuousJob: Job? = null

                        if (onContinuousTrigger != null) {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_PRESS)
                            onContinuousTrigger()
                            
                            // Start continuous loop
                            continuousJob = coroutineScope.launch {
                                delay(400) // Initial delay before repeating
                                while (true) {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_PRESS)
                                    triggerCount++
                                    displayCount = triggerCount
                                    onContinuousTrigger()
                                    delay(100) // Repeat interval
                                }
                            }
                        }

                        val up = waitForUpOrCancellation()
                        continuousJob?.cancel()
                        
                        // Bounce back to 1.0f on release with a custom physics spring (matches cubic-bezier bouncy exit)
                        coroutineScope.launch { 
                            scale.animateTo(1f, spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessMedium)) 
                        }

                        isPressed = false
                        
                        // Action for single-click buttons happens on UP event if it wasn't cancelled
                        if (up != null && onClick != null) {
                            view.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
                            onClick()
                        }

                        val currentCount = triggerCount
                        if (currentCount > 1) {
                            coroutineScope.launch {
                                delay(500)
                                if (!isPressed) triggerCount = 0
                            }
                        } else {
                            triggerCount = 0
                        }
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.scale(scale.value),
                tint = MaterialTheme.colorScheme.onSurface
            )
        }
        
        AnimatedVisibility(
            visible = triggerCount > 1,
            enter = fadeIn() + slideInVertically(initialOffsetY = { 20 }),
            exit = fadeOut() + slideOutVertically(targetOffsetY = { 20 }),
            modifier = Modifier.absoluteOffset(y = (-40).dp)
        ) {
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.onSurface,
                contentColor = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp
            ) {
                Text(
                    text = "x$displayCount",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .scale(bumpScale.value)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
fun SendButton(
    onClick: () -> Unit,
    enabled: Boolean
) {
    val scale = remember { Animatable(1f) }
    val view = LocalView.current
    val coroutineScope = rememberCoroutineScope()
    val bgColor = if (enabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
    val contentColor = if (enabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)

    Box(
        modifier = Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(bgColor)
            .pointerInput(enabled) {
                if (!enabled) return@pointerInput
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    coroutineScope.launch { scale.animateTo(0.9f, tween(100)) }
                    view.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
                    
                    val up = waitForUpOrCancellation()
                    if (up != null) {
                        onClick()
                        // Optional pop animation
                        coroutineScope.launch { 
                            scale.animateTo(1.15f, tween(150))
                            scale.animateTo(1f, spring())
                        }
                    } else {
                        coroutineScope.launch { scale.animateTo(1f, spring()) }
                    }
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.AutoMirrored.Rounded.Send,
            contentDescription = "Send",
            modifier = Modifier.scale(scale.value),
            tint = contentColor
        )
    }
}
