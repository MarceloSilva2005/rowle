package com.rowle.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.model.Event
import com.rowle.resources.Res
import com.rowle.ui.theme.Ink
import com.rowle.ui.theme.Lime
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

internal enum class PosterStyle { RAIL, LIME_TYPE, BAND }

internal fun posterStyle(id: String): PosterStyle {
    val n = id.toIntOrNull() ?: id.hashCode()
    return when (kotlin.math.abs(n) % 3) {
        0 -> PosterStyle.RAIL
        1 -> PosterStyle.LIME_TYPE
        else -> PosterStyle.BAND
    }
}

internal fun eventCoverRes(id: String): DrawableResource? = when (id) {
    "1" -> Res.drawable.cover_1
    "2" -> Res.drawable.cover_2
    "3" -> Res.drawable.cover_3
    "4" -> Res.drawable.cover_4
    "5" -> Res.drawable.cover_5
    else -> null
}

@Composable
fun EventCover(
    event: Event,
    modifier: Modifier = Modifier,
    height: Dp = 200.dp
) {
    val style = posterStyle(event.id)
    val mark = event.title.trim().firstOrNull()?.uppercaseChar()?.toString() ?: ""
    val titleColor = when (style) {
        PosterStyle.RAIL -> Color.White
        PosterStyle.LIME_TYPE -> Lime
        PosterStyle.BAND -> Color.Black
    }
    val titleStart = if (style == PosterStyle.RAIL) 16.dp else 12.dp

    val coverRes = eventCoverRes(event.id)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(Color.Black)
    ) {
        if (coverRes != null) {
            Image(
                painter = painterResource(coverRes),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.28f))
            )
        }

        HatchOverlay()

        if (coverRes != null && style != PosterStyle.BAND) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .height(120.dp)
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.82f))
                        )
                    )
            )
        }

        if (mark.isNotEmpty()) {
            Text(
                text = mark,
                color = Lime.copy(alpha = 0.16f),
                style = MaterialTheme.typography.displayLarge.copy(
                    fontSize = 160.sp,
                    lineHeight = 160.sp
                ),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .offset(x = 16.dp, y = 36.dp)
            )
        }

        when (style) {
            PosterStyle.RAIL -> Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .fillMaxHeight()
                    .width(6.dp)
                    .background(Lime)
            )
            PosterStyle.LIME_TYPE -> Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .fillMaxWidth()
                    .height(6.dp)
                    .background(Lime)
            )
            PosterStyle.BAND -> Unit
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(6.dp)
                .border(1.dp, Lime.copy(alpha = 0.4f), RectangleShape)
        )

        CategoryBadge(
            category = event.category,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = titleStart, top = 12.dp)
        )

        val titleModifier = if (style == PosterStyle.BAND) {
            Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .background(Lime)
                .padding(horizontal = 12.dp, vertical = 12.dp)
        } else {
            Modifier
                .align(Alignment.BottomStart)
                .padding(start = titleStart, end = 12.dp, bottom = 12.dp)
        }

        Text(
            text = event.title.uppercase(),
            style = MaterialTheme.typography.titleLarge,
            color = titleColor,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis,
            modifier = titleModifier
        )
    }
}

@Composable
fun CategoryBadge(
    category: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = category.uppercase(),
        color = Ink,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.2.sp,
        modifier = modifier
            .background(Lime)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}
