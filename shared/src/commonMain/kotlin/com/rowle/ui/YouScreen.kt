package com.rowle.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private const val APP_VERSION = "0.1.0"

@Composable
fun YouScreen(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Text(
            text = "VOCÊ",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(top = 20.dp)
        )
        LimeSlash(modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
        Text(
            text = "A toupeira cava Brasília pra você.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp)
        )

        YouLabel("O APP")
        YouBody("Rowlê mostra a semana de Brasília. De graça, sem anúncio. Horário, lugar, preço e classificação entram quando a fonte escreve.")

        YouLabel("NESTE APARELHO")
        YouBody("Os rolês marcados ficam só neste celular. Sem conta.")

        YouLabel("VERSÃO")
        Text(
            text = APP_VERSION,
            color = Color.White,
            style = MaterialTheme.typography.titleLarge
        )

        YouLabel("CRÉDITOS")
        YouBody("Cada rolê é conferido numa fonte publicada. O link fica na ficha.")
        YouBody(
            "Foto do Centro de Convenções Ulysses Guimarães: Borowskki, 2012, domínio público.",
            modifier = Modifier.padding(top = 8.dp)
        )
        YouBody(
            "Barlow Condensed, licença SIL Open Font.",
            modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)
        )
    }
}

@Composable
private fun YouLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = Color(0xFF8A8A8A),
        modifier = Modifier.padding(top = 24.dp, bottom = 8.dp)
    )
}

@Composable
private fun YouBody(
    text: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontSize = 15.sp,
        lineHeight = 22.sp,
        modifier = modifier
    )
}
