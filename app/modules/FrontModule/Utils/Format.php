<?php

namespace App\Modules\FrontModule\Utils;

use Nette;

class Format
{
	use Nette\SmartObject;

	/**
	 * @param int $size
	 * @param int $precision
	 * @return string
	 */
	public static function bytes($size, $precision = 1)
	{
		$base = log($size, 1024);
		//$suffixes = array('B', 'KiB', 'MiB', 'GiB', 'TiB');
		$suffixes = array('B', 'KB', 'MB', 'GB', 'TB');

		return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[(int)floor($base)];
	}

	/**
	 * @param int $count
	 * @param int $precision
	 * @return string
	 */
	public static function count($count, $precision = 1)
	{
		$base = log($count, 1000);
		$suffixes = array('', 'k', 'M', 'G', 'T');

		return round(pow(1000, $base - floor($base)), $precision) . $suffixes[(int)floor($base)];
	}
}