<?php

namespace App\Modules\FrontModule\Control\CollectionsMenu;

use App\Modules\FrontModule\Service\Connection;
use App\Modules\FrontModule\Utils\Format;
use DK\Menu;
use Nette;

class CollectionsMenuFactory {
	use Nette\SmartObject;

	/** @var Nette\Application\Application */
	private $app;

	/** @var Nette\Security\User */
	private $user;

	/** @var Connection */
	private $connection;

	/** @var \DK\Menu\UI\IControlFactory */
	private $menuFactory;

	/**
	 * CollectionsMenuFactory constructor.
	 * @param Connection $connection
	 * @param Menu\UI\IControlFactory $menuFactory
	 */
	public function __construct(Nette\Application\Application $app, Nette\Security\User $user, Connection $connection, Menu\UI\IControlFactory $menuFactory) {
		$this->app = $app;
		$this->user = $user;
		$this->connection    = $connection;
		$this->menuFactory   = $menuFactory;
	}

	/**
	 * @return Menu\UI\Control
	 */
	public function create() {
		$control = new \DK\Menu\UI\Control(\DK\Menu\DI\Extension::createMenu('actions', [], $this->app, $this->user));
		$control->setMenuTemplate(__DIR__ . '/control.latte');

		foreach($this->connection->listDatabases() as $db) {
			$dbName = $db->getName();
			$dbItem = $control
				->getMenu()
				->addItem($dbName, "Default:list", [ "database" => $dbName ])
				->addData("size", Format::bytes($db->getSizeOnDisk()));

			foreach ($this->connection->listCollections($dbName) as $col) {
				$colName = $col->getName();
				$stats = $this->connection->getCollectionStats($dbName, $colName);

				$dbItem
					->addItem($colName, "Default:scheme", [ "database" => $dbName, "collection" => $colName ])
					->addData("count", Format::count($stats->count))
					->addData("size", Format::bytes($stats->size))->isActive();
			}

		}

		return $control;
	}
}