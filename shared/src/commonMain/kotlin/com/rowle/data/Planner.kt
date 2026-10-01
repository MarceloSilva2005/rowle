package com.rowle.data

import androidx.compose.runtime.Composable
import com.rowle.model.Event

interface Planner {
    fun openMaps(event: Event)
    fun addToCalendar(event: Event)
}

@Composable
expect fun rememberPlanner(): Planner
