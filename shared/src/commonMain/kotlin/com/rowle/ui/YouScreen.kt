package com.rowle.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.ui.theme.Lime

@Composable
fun YouScreen(
    savedCount: Int,
    onOpenSaved: () -> Unit,
    modifier: Modifier = Modifier
) {
    val lime = MaterialTheme.colorScheme.primary

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Text(
            text = "VOCÊ",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(top = 20.dp)
        )
        LimeSlash(modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
        Text(
            text = "Sem conta. Seus rolês ficam neste aparelho.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF111111))
                .border(1.dp, Lime.copy(alpha = 0.45f), RectangleShape)
                .clickable(onClick = onOpenSaved)
                .padding(20.dp)
        ) {
            Text(
                text = savedCount.toString(),
                color = lime,
                style = MaterialTheme.typography.displayLarge,
                fontSize = 64.sp,
                lineHeight = 64.sp
            )
            Text(
                text = if (savedCount == 1) "ROLÊ SALVO" else "ROLÊS SALVOS",
                style = MaterialTheme.typography.labelLarge,
                color = Color.White
            )
            Text(
                text = if (savedCount == 0) {
                    "Marca o coração num evento pra contar aqui."
                } else {
                    "Abre a lista dos que você marcou."
                },
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        Text(
            text = "SOBRE",
            style = MaterialTheme.typography.labelLarge,
            color = Color(0xFF8A8A8A),
            modifier = Modifier.padding(top = 28.dp, bottom = 8.dp)
        )
        Text(
            text = "A toupeira cava Brasília pra você — shows, cultura e o que não aparece no folder.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 15.sp,
            lineHeight = 22.sp
        )

        Text(
            text = "CIDADE",
            style = MaterialTheme.typography.labelLarge,
            color = Color(0xFF8A8A8A),
            modifier = Modifier.padding(top = 24.dp, bottom = 8.dp)
        )
        Text(
            text = "Brasília / DF",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge
        )
    }
}
