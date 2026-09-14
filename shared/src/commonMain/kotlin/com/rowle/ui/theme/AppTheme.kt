package com.rowle.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Lime = Color(0xFFC8FF00)
private val Ink = Color(0xFF000000)

private val RowleColors = darkColorScheme(
    primary = Lime,
    onPrimary = Ink,
    secondary = Lime,
    onSecondary = Ink,
    background = Ink,
    surface = Color(0xFF111111),
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF141414),
    onSurfaceVariant = Color(0xFFB3B3B3),
    outline = Lime
)

@Composable
fun RowleTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = RowleColors,
        content = content
    )
}
