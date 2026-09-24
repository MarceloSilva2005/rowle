package com.rowle.data

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.ObjCObjectVar
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import platform.Foundation.NSError
import platform.Foundation.NSString
import platform.Foundation.NSURL
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.NSUserDefaults
import platform.Foundation.stringWithContentsOfURL

private const val KEY_AGENDA = "agenda_json"

internal actual fun readSavedAgenda(): String? =
    NSUserDefaults.standardUserDefaults.stringForKey(KEY_AGENDA)

internal actual fun writeSavedAgenda(json: String) {
    NSUserDefaults.standardUserDefaults.setObject(json, KEY_AGENDA)
}

@OptIn(ExperimentalForeignApi::class)
internal actual fun fetchAgenda(url: String): String? = runCatching {
    val nsUrl = NSURL.URLWithString(url) ?: return null
    memScoped {
        val error = alloc<ObjCObjectVar<NSError?>>()
        NSString.stringWithContentsOfURL(nsUrl, NSUTF8StringEncoding, error.ptr)
    }
}.getOrNull()
