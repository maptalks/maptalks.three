export default function WorkerPlugin() {
    return {
        name: 'maptalks-worker-resolve', // 此名称将出现在警告和错误中
        // resolveId(source) {
        //     if (source === 'virtual-module') {
        //         // 这表示 rollup 不应询问其他插件或
        //         // 从文件系统检查以找到此 ID
        //         return source;
        //     }
        //     return null; // 其他ID应按通常方式处理
        // },
        renderChunk(code, chunk) {
            code = code.replace('define([\'exports\'],', '');
            code = code.replace('define(["exports"],', '');
            code = code.substring(0, code.length - 2);
            return 'export default `' + code + '`';
        }
    };
}
