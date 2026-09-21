package com.rowle.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.eventShareText
import com.rowle.data.eventSheet
import com.rowle.data.rememberSharer
import com.rowle.model.Event
import com.rowle.model.EventFact
import com.rowle.model.FactKind
import com.rowle.ui.theme.Hairline
import com.rowle.ui.theme.Ink
import com.rowle.ui.theme.Lime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailScreen(
    event: Event,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uriHandler = LocalUriHandler.current
    val sharer = rememberSharer()
    val eventLink = event.link

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    FavoriteButton(
                        isFavorite = isFavorite,
                        onClick = onToggleFavorite,
                        inactiveTint = MaterialTheme.colorScheme.onBackground
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            EventCover(event = event, height = 300.dp)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(Hairline)
            )
            eventSheet(event).forEach { fact ->
                FactRow(fact)
            }

            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "SOBRE",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )
                LimeSlash()
                Text(
                    text = event.description,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 16.sp,
                    lineHeight = 22.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedButton(
                    onClick = { sharer.share(eventShareText(event)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RectangleShape
                ) {
                    Text(
                        text = "COMPARTILHAR",
                        letterSpacing = 1.2.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (!eventLink.isNullOrBlank()) {
                    Button(
                        onClick = { uriHandler.openUri(eventLink) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RectangleShape
                    ) {
                        Text(
                            text = "SAIBA MAIS",
                            letterSpacing = 1.2.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FactRow(fact: EventFact) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = fact.label.uppercase(),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.1.sp,
            modifier = Modifier.width(112.dp)
        )
        val condensed = MaterialTheme.typography.labelLarge
        when (fact.kind) {
            FactKind.STAMP -> {
                val mark = ratingMark(fact.value)
                val frame = if (mark.bordered) Modifier.border(1.dp, Color.White) else Modifier
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(mark.fill)
                        .then(frame),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = mark.mark,
                        color = mark.ink,
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontSize = 22.sp,
                            lineHeight = 22.sp
                        )
                    )
                }
            }
            FactKind.PRICE -> Text(
                text = fact.value,
                color = Lime,
                style = condensed.copy(fontSize = 22.sp, letterSpacing = 0.sp)
            )
            FactKind.TEXT -> Text(
                text = fact.value,
                color = MaterialTheme.colorScheme.onBackground,
                style = condensed.copy(
                    fontSize = 18.sp,
                    lineHeight = 22.sp,
                    letterSpacing = 0.sp
                ),
                modifier = Modifier.weight(1f)
            )
        }
    }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Hairline)
    )
}

private data class RatingMark(
    val mark: String,
    val fill: Color,
    val ink: Color,
    val bordered: Boolean
)

private fun ratingMark(rating: String): RatingMark {
    val digits = rating.filter { it.isDigit() }
    val key = when {
        rating.equals("livre", ignoreCase = true) || rating.equals("L", ignoreCase = true) -> "L"
        digits.isNotEmpty() -> digits
        else -> ""
    }
    return when (key) {
        "L" -> RatingMark("L", Color(0xFF00A651), Color.White, false)
        "10" -> RatingMark("10", Color(0xFF0096D6), Color.White, false)
        "12" -> RatingMark("12", Color(0xFFFFCC00), Ink, false)
        "14" -> RatingMark("14", Color(0xFFF58220), Color.White, false)
        "16" -> RatingMark("16", Color(0xFFED1C24), Color.White, false)
        "18" -> RatingMark("18", Ink, Color.White, true)
        else -> RatingMark(rating.uppercase(), Lime, Ink, false)
    }
}
