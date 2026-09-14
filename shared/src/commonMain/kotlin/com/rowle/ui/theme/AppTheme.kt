package com.rowle.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF1565C0),
    onPrimary = Color.White,
    secondary = Color(0xFF5C6BC0),
    background = Color(0xFFF7F7F7),
    surface = Color.White,
    onBackground = Color(0xFF111111),
    onSurface = Color(0xFF111111),
    surfaceVariant = Color(0xFFE7E7E7),
    onSurfaceVariant = Color(0xFF666666)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF64B5F6),
    onPrimary = Color(0xFF003258),
    secondary = Color(0xFF9FA8DA),
    background = Color(0xFF121212),
    surface = Color(0xFF1E1E1E),
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF2A2A2A),
    onSurfaceVariant = Color(0xFFBDBDBD)
)

private val AmoledColors = darkColorScheme(
    primary = Color(0xFF64B5F6),
    onPrimary = Color(0xFF001A2E),
    secondary = Color(0xFF9FA8DA),
    background = Color.Black,
    surface = Color(0xFF080808),
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF111111),
    onSurfaceVariant = Color(0xFFB0B0B0)
)

enum class AppTheme {
    LIGHT,
    DARK,
    AMOLED
}

@Composable
fun RowleTheme(
    theme: AppTheme = AppTheme.LIGHT,
    content: @Composable () -> Unit
) {
    val colors = when (theme) {
        AppTheme.LIGHT -> LightColors
        AppTheme.DARK -> DarkColors
        AppTheme.AMOLED -> AmoledColors
    }

    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
