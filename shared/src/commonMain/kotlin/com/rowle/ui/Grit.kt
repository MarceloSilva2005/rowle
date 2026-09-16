package com.rowle.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.dp
import com.rowle.ui.theme.Lime

@Composable
fun HatchOverlay(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val step = 8.dp.toPx()
        val stroke = 1.dp.toPx()
        val color = Lime.copy(alpha = 0.07f)
        var x = -size.height
        while (x < size.width + size.height) {
            drawLine(
                color = color,
                start = Offset(x, 0f),
                end = Offset(x + size.height, size.height),
                strokeWidth = stroke
            )
            x += step
        }
    }
}

@Composable
fun LimeSlash(modifier: Modifier = Modifier) {
    Box(
        modifier
            .width(44.dp)
            .height(3.dp)
            .background(Lime)
    )
}
