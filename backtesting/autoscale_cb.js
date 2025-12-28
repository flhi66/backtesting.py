if (!window._bt_scale_range) {
    window._bt_scale_range = function (range, min, max, pad) {
        "use strict";
        if (min !== Infinity && max !== -Infinity) {
            pad = pad ? (max - min) * .03 : 0;
            range.start = min - pad;
            range.end = max + pad;
        } else {
            console.error('scale range error:', min, max, range);
        }
    };
}

// Hauptfunktion zum Y-Auto-Scaling (inkl. Volumen)
if (!window._bt_autoscale) {
    window._bt_autoscale = function (cb_obj) {
        "use strict";

        let i = Math.max(Math.floor(cb_obj.start), 0),
            j = Math.min(Math.ceil(cb_obj.end), source.data['ohlc_high'].length);

        let max = Math.max.apply(null, source.data['ohlc_high'].slice(i, j)),
            min = Math.min.apply(null, source.data['ohlc_low'].slice(i, j));

        _bt_scale_range(ohlc_range, min, max, true);

        if (volume_range) {
            let vmax = Math.max.apply(null, source.data['Volume'].slice(i, j));
            _bt_scale_range(volume_range, 0, vmax * 1.03, false);
        }

        // Y-Achse wieder freigeben (falls vorher per bounds fixiert)
        //ohlc_range.bounds = null;
        if (volume_range) volume_range.bounds = null;


    };
}

// Sofortige Reaktion (Quick-Fix gegen Stretching beim Panstart)
try {
    let i = Math.max(Math.floor(cb_obj.start), 0),
        j = Math.min(Math.ceil(cb_obj.end), source.data['ohlc_high'].length);

    let max = Math.max.apply(null, source.data['ohlc_high'].slice(i, j)),
        min = Math.min.apply(null, source.data['ohlc_low'].slice(i, j));

    // Sofort setzen
    ohlc_range.start = min - (max - min) * .03;
    ohlc_range.end   = max + (max - min) * .03;

    // Y-Achse für kurze Zeit „einfrieren“
    //ohlc_range.bounds = [ohlc_range.start, ohlc_range.end];

    if (volume_range) {
        let vmax = Math.max.apply(null, source.data['Volume'].slice(i, j));
        volume_range.start = 0;
        volume_range.end = vmax * 1.03;
        volume_range.bounds = [0, vmax * 1.03];
    }
} catch (e) {
    console.warn("Quick-scale Fehler:", e);
}

// Debounce: Nach kurzer Zeit sauber nachziehen
clearTimeout(window._bt_autoscale_timeout);
window._bt_autoscale_timeout = setTimeout(function () {
    try {
        _bt_autoscale(cb_obj);
    } catch (e) {
        console.warn("Autoscale Fehler (verzögert):", e);
    }
}, 150);  // 150 ms warten – das verhindert Flackern
