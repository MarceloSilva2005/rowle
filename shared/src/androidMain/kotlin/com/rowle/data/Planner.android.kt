package com.rowle.data

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.provider.CalendarContract
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.rowle.model.Event
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atTime
import kotlinx.datetime.toInstant

@Composable
actual fun rememberPlanner(): Planner {
    val context = LocalContext.current
    return remember(context) {
        object : Planner {
            override fun openMaps(event: Event) {
                val query = venueQuery(event.location)
                val geo = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(query)}"))
                if (!launch(context, geo)) {
                    launch(context, Intent(Intent.ACTION_VIEW, Uri.parse(mapsSearchUrl(event.location))))
                }
            }

            override fun addToCalendar(event: Event) {
                val start = event.date.atTime(event.time)
                    .toInstant(TimeZone.of("America/Sao_Paulo"))
                    .toEpochMilliseconds()
                val insert = Intent(Intent.ACTION_INSERT).apply {
                    data = CalendarContract.Events.CONTENT_URI
                    putExtra(CalendarContract.Events.TITLE, event.title)
                    putExtra(CalendarContract.Events.EVENT_LOCATION, event.location)
                    putExtra(CalendarContract.Events.DESCRIPTION, calendarNote(event))
                    putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
                    putExtra(CalendarContract.Events.EVENT_TIMEZONE, "America/Sao_Paulo")
                }
                if (!launch(context, insert)) {
                    launch(context, Intent(Intent.ACTION_VIEW, Uri.parse(calendarPageUrl(event))))
                }
            }
        }
    }
}

private fun launch(context: android.content.Context, intent: Intent): Boolean {
    if (context !is Activity) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return try {
        context.startActivity(intent)
        true
    } catch (_: ActivityNotFoundException) {
        false
    }
}
