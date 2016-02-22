<?php

$data = [
	'email' => $faker->email,
	'text' => $faker->text,
];

view('index', $data);
