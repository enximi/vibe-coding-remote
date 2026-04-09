package com.enximi.voicebridge.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enximi.voicebridge.data.HistoryItem
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val historyTodayFormatter = DateTimeFormatter.ofPattern("今天 HH:mm")
private val historyDateTimeFormatter = DateTimeFormatter.ofPattern("MM-dd HH:mm")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    serverUrl: String,
    onServerUrlChange: (String) -> Unit,
    enterToSend: Boolean,
    onEnterToSendChange: (Boolean) -> Unit,
    themeMode: String,
    onThemeModeChange: (String) -> Unit,
    showCopy: Boolean,
    onShowCopyChange: (Boolean) -> Unit,
    showPaste: Boolean,
    onShowPasteChange: (Boolean) -> Unit,
    showTab: Boolean,
    onShowTabChange: (Boolean) -> Unit,
    showNewline: Boolean,
    onShowNewlineChange: (Boolean) -> Unit,
    showBackspace: Boolean,
    onShowBackspaceChange: (Boolean) -> Unit,
    sendHistory: List<HistoryItem>,
    onHistoryItemClick: (HistoryItem) -> Unit,
    onClearHistoryClick: () -> Unit,
    onDismissRequest: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text(
                text = "设置",
                fontSize = 22.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Server group
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "电脑端地址",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = onServerUrlChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("例如 http://192.168.1.8:8765") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // Keyboard actions
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "回车键行为",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    SegmentButton(
                        text = "发送内容",
                        selected = enterToSend,
                        onClick = { onEnterToSendChange(true) },
                        modifier = Modifier.weight(1f)
                    )
                    SegmentButton(
                        text = "换行",
                        selected = !enterToSend,
                        onClick = { onEnterToSendChange(false) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Theme Setting
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "系统主题",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    SegmentButton(
                        text = "跟随系统",
                        selected = themeMode == "auto",
                        onClick = { onThemeModeChange("auto") },
                        modifier = Modifier.weight(1f)
                    )
                    SegmentButton(
                        text = "浅色",
                        selected = themeMode == "light",
                        onClick = { onThemeModeChange("light") },
                        modifier = Modifier.weight(1f)
                    )
                    SegmentButton(
                        text = "深色",
                        selected = themeMode == "dark",
                        onClick = { onThemeModeChange("dark") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Dock Button Visibility Setting
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "悬浮岛按键显示",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                @OptIn(ExperimentalLayoutApi::class)
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = showCopy,
                        onClick = { onShowCopyChange(!showCopy) },
                        label = { Text("复制") }
                    )
                    FilterChip(
                        selected = showPaste,
                        onClick = { onShowPasteChange(!showPaste) },
                        label = { Text("粘贴") }
                    )
                    FilterChip(
                        selected = showTab,
                        onClick = { onShowTabChange(!showTab) },
                        label = { Text("Tab 缩进") }
                    )
                    FilterChip(
                        selected = showNewline,
                        onClick = { onShowNewlineChange(!showNewline) },
                        label = { Text("插入换行") }
                    )
                    FilterChip(
                        selected = showBackspace,
                        onClick = { onShowBackspaceChange(!showBackspace) },
                        label = { Text("实体退格") }
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "最近发送记录",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (sendHistory.isNotEmpty()) {
                        TextButton(onClick = onClearHistoryClick) {
                            Text("清空全部")
                        }
                    }
                }

                if (sendHistory.isEmpty()) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Text(
                            text = "过去犹如一张白纸",
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 16.dp),
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 280.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            .verticalScroll(rememberScrollState())
                            .padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        sendHistory.forEach { item ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { onHistoryItemClick(item) },
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surface
                            ) {
                                Column(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = formatHistoryTime(item.time),
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = item.text,
                                        fontSize = 14.sp,
                                        lineHeight = 22.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SegmentButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TextButton(
        onClick = onClick,
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) MaterialTheme.colorScheme.surface else Color.Transparent),
        colors = ButtonDefaults.textButtonColors(
            contentColor = if (selected) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
        )
    ) {
        Text(text, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
    }
}

private fun formatHistoryTime(timestamp: Long): String {
    if (timestamp <= 0L) return "较早"

    val zoneId = ZoneId.systemDefault()
    val dateTime = Instant.ofEpochMilli(timestamp).atZone(zoneId)
    val now = Instant.now().atZone(zoneId)

    return if (dateTime.toLocalDate() == now.toLocalDate()) {
        historyTodayFormatter.format(dateTime)
    } else {
        historyDateTimeFormatter.format(dateTime)
    }
}
