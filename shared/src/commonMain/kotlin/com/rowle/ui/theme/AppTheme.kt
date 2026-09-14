package com.rowle.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Lime = Color(0xFFC8FF00)
private val Ink = Color(0xFF000000)
private val Night = Color(0xFF121212)
private val CardDark = Color(0xFF161616)
private val CardAmoled = Color(0xFF111111)
private val MutedDark = Color(0xFFB3B3B3)

private val LightColors = lightColorScheme(
    primary = Color(0xFF5A8A00),
    onPrimary = Color.White,
    secondary = Color(0xFF5A8A00),
    onSecondary = Color.White,
    background = Color(0xFFF4F4F0),
    surface = Color.White,
    onBackground = Ink,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE8E8E0),
    onSurfaceVariant = Color(0xFF5C5C5C),
    outline = Color(0xFF5A8A00)
)

private val DarkColors = darkColorScheme(
    primary = Lime,
    onPrimary = Ink,
    secondary = Lime,
    onSecondary = Ink,
    background = Night,
    surface = CardDark,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF1C1C1C),
    onSurfaceVariant = MutedDark,
    outline = Lime
)

private val AmoledColors = darkColorScheme(
    primary = Lime,
    onPrimary = Ink,
    secondary = Lime,
    onSecondary = Ink,
    background = Ink,
    surface = CardAmoled,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF141414),
    onSurfaceVariant = MutedDark,
    outline = Lime
)

enum class AppTheme {
    LIGHT,
    DARK,
    AMOLED
}

@Composable
fun RowleTheme(
    theme: AppTheme = AppTheme.AMOLED,
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
