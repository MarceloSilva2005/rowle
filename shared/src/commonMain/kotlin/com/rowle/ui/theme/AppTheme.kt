package com.rowle.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.rowle.resources.Res
import org.jetbrains.compose.resources.Font

val Lime = Color(0xFFC8FF00)
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
    val display = FontFamily(
        Font(Res.font.barlow_condensed_black_italic, FontWeight.Black, FontStyle.Italic)
    )
    val condensed = FontFamily(
        Font(Res.font.barlow_condensed_bold, FontWeight.Bold, FontStyle.Normal)
    )
    val base = Typography()
    val typography = base.copy(
        displayLarge = base.displayLarge.copy(
            fontFamily = display,
            fontWeight = FontWeight.Black,
            fontStyle = FontStyle.Italic,
            fontSize = 40.sp,
            lineHeight = 40.sp,
            letterSpacing = 0.4.sp,
            color = Color.White
        ),
        headlineLarge = base.headlineLarge.copy(
            fontFamily = display,
            fontWeight = FontWeight.Black,
            fontStyle = FontStyle.Italic,
            fontSize = 34.sp,
            lineHeight = 34.sp,
            letterSpacing = 0.6.sp
        ),
        titleLarge = base.titleLarge.copy(
            fontFamily = display,
            fontWeight = FontWeight.Black,
            fontStyle = FontStyle.Italic,
            fontSize = 24.sp,
            lineHeight = 26.sp
        ),
        labelLarge = base.labelLarge.copy(
            fontFamily = condensed,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            letterSpacing = 1.4.sp
        )
    )

    MaterialTheme(
        colorScheme = RowleColors,
        typography = typography,
        content = content
    )
}
