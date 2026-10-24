<?php

function queueBatchSequence($queueNumber)
{
    if (!preg_match('/^\d{8}-(\d{2,3})$/', (string) $queueNumber, $matches)) {
        return 0;
    }

    return (int) $matches[1];
}

function normalizeQueueBatchNumber($queueNumber)
{
    if (!preg_match('/^(\d{8})-(\d{2,3})$/', (string) $queueNumber, $matches)) {
        return $queueNumber;
    }

    $sequence = min(99, max(1, (int) $matches[2]));
    return $matches[1] . '-' . str_pad($sequence, 2, '0', STR_PAD_LEFT);
}
