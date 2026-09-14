package com.rowle.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.ui.theme.AppTheme

@Composable
fun SettingsScreen(
    currentTheme: AppTheme,
    onThemeSelected: (AppTheme) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "Configurações",
            fontSize = 28.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Aparência",
            fontSize = 20.sp
        )

        ThemeOption(
            title = "☀️ Claro",
            selected = currentTheme == AppTheme.LIGHT,
            onClick = {
                onThemeSelected(AppTheme.LIGHT)
            }
        )

        ThemeOption(
            title = "🌙 Escuro",
            selected = currentTheme == AppTheme.DARK,
            onClick = {
                onThemeSelected(AppTheme.DARK)
            }
        )

        ThemeOption(
            title = "🖤 AMOLED",
            selected = currentTheme == AppTheme.AMOLED,
            onClick = {
                onThemeSelected(AppTheme.AMOLED)
            }
        )
    }
}

@Composable
private fun ThemeOption(
    title: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = selected,
            onClick = onClick
        )

        Text(
            text = title,
            fontSize = 17.sp
        )
    }
}
