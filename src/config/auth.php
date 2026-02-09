<?php

return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'tusers',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'tusers',
        ],
    ],

    'providers' => [
        'tusers' => [
            'driver' => 'eloquent',
            'model' => App\Models\TUser::class,
        ],
    ],

    'passwords' => [
        'tusers' => [
            'provider' => 'tusers',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,
];
