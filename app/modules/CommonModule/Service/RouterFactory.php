<?php

namespace App\Modules\CommonModule\Service;

use Nette;
use Nette\Application\Routers\RouteList;
use Nette\Application\Routers\Route;


class RouterFactory
{
	use Nette\StaticClass;

	/**
	 * @return Nette\Application\IRouter
	 */
	public static function createRouter()
	{
		$router = new RouteList();

		// Error conditions
		$router[] = new Route('unsupported-browser', 'Common:UnsupportedBrowser:default');

		// Front
		$router[] = $frontRouter = new RouteList('Front');
		$frontRouter[] = new Route('sign/in',  'Sign:in');
		$frontRouter[] = new Route('sign/out', 'Sign:out');
		$frontRouter[] = new Route('data/<database>/<collection>', 'Data:default');
		$frontRouter[] = new Route('<action>/<database>/[<collection>]', 'Default:scheme');
		$frontRouter[] = new Route('<presenter>/<action>', 'Default:default');

		return $router;
	}

}
