<?php

namespace App\Modules\FrontModule\Control\ActionsMenu;

use DK\Menu;
use Nette;

class ActionsMenuFactory {
	use Nette\SmartObject;

	/** @var Nette\Application\Application */
	private $app;

	/** @var Nette\Security\User */
	private $user;

	/**
	 * ActionsMenuFactory constructor.
	 * @param Nette\Application\Application $app
	 * @param Nette\Security\User $user
	 */
	public function __construct(Nette\Application\Application $app, Nette\Security\User $user)
	{
		$this->app = $app;
		$this->user = $user;
	}

	/**
	 * @return Menu\UI\Control
	 */
	public function create() {
		$control = new \DK\Menu\UI\Control(\DK\Menu\DI\Extension::createMenu('actions', [], $this->app, $this->user));
		$control->setMenuTemplate(__DIR__ . '/control.latte');
		return $control;
	}
}