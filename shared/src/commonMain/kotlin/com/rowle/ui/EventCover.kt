package com.rowle.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.ui.theme.Lime

@Composable
fun EventCover(
    category: String,
    modifier: Modifier = Modifier,
    height: Dp = 200.dp
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(coverTone(category))
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color(0xCC000000))
                    )
                )
        )
        CategoryBadge(
            category = category,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp)
        )
    }
}

@Composable
fun CategoryBadge(
    category: String,
    modifier: Modifier = Modifier
) {
    Surface(
        color = categoryTint(category),
        shape = RoundedCornerShape(4.dp),
        modifier = modifier
    ) {
        Text(
            text = category.uppercase(),
            color = categoryOnTint(category),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

internal fun coverTone(category: String): Color {
    return when (category) {
        "Shows" -> Color(0xFF2A1020)
        "Cultura" -> Color(0xFF1A1228)
        "Tecnologia" -> Color(0xFF102418)
        else -> Color(0xFF1A1A1A)
    }
}

internal fun categoryTint(category: String): Color {
    return when (category) {
        "Shows" -> Color(0xFFFF4FA3)
        "Cultura" -> Color(0xFFC77DFF)
        "Tecnologia" -> Lime
        else -> Lime
    }
}

internal fun categoryOnTint(category: String): Color {
    return if (category == "Tecnologia") Color.Black else Color.White
}
