(function () {
    // A Hilbert space-filling curve
    function interleave (x) {
        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
        return x;
    }
    function deinterleave (x) {
        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
        return x;
    }
    function hilbert (x, y) {
        var a = x ^ y;
        var b = 0xFFFF ^ a;
        var c = 0xFFFF ^ (x | y);
        var d = x & (y ^ 0xFFFF);

        var A = a | (b >> 1);
        var B = (a >> 1) ^ a;// descan
        var C = ((c >> 1) ^ (b & (d >> 1))) ^ c;
        var D = ((a & (c >> 1)) ^ (d >> 1)) ^ d;// sw

        var i0, i1;

        a = A; b = B; c = C; d = D;
        A = ((a & (a >> 2)) ^ (b & (b >> 2)));
        B = ((a & (b >> 2)) ^ (b & ((a ^ b) >> 2)));
        C ^= ((a & (c >> 2)) ^ (b & (d >> 2)));
        D ^= ((b & (c >> 2)) ^ ((a ^ b) & (d >> 2)));// nw

        a = A; b = B; c = C; d = D;
        A = ((a & (a >> 4)) ^ (b & (b >> 4)));
        B = ((a & (b >> 4)) ^ (b & ((a ^ b) >> 4)));
        C ^= ((a & (c >> 4)) ^ (b & (d >> 4)));
        D ^= ((b & (c >> 4)) ^ ((a ^ b) & (d >> 4)));// ne

        a = A; b = B; c = C; d = D;
        C ^= ((a & (c >> 8)) ^ (b & (d >> 8)));
        D ^= ((b & (c >> 8)) ^ ((a ^ b) & (d >> 8)));// se

        // undo transformation prefix scan
        // 前缀扫描技术来并行化从索引到坐标的映射
        a = C ^ (C >> 1);
        b = D ^ (D >> 1);

        // recover index bits
        i0 = x ^ y;
        i1 = b | (0xFFFF ^ (i0 | a));

        i0 = interleave(i0);
        i1 = deinterleave(i1);

        return ((i1 << 1) | i0) >>> 0;
    }
    return hilbert;
})();