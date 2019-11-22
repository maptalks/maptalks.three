var queue = [
    // {
    //     worker,
    //     params,
    //     callback
    // }
];

var runing = false;

function pushQueue(worker, params, callback) {
    queue.push({
        worker,
        params,
        callback
    });
    if (!runing) {
        message();
    }
}

function message() {
    if (queue.length > 0) {
        const { worker, params, callback } = queue[0];
        worker.postMessage(params);
        runing = true;
        worker.onmessage = (e) => {
            callback(e);
            queue.splice(0, 1);
            //  循环消费
            message();
        };
    } else {
        runing = false;
    }
}