<?php

namespace App\Modules\FrontModule\Presenters;

use App\Modules\FrontModule\Control\ActionsMenu\ActionsMenuFactory;
use App\Modules\FrontModule\Control\CollectionsMenu\CollectionsMenuFactory;
use App\Modules\FrontModule\Service\Connection;
use App\Modules\FrontModule\Utils\Format;
use Nette\Application\UI\Form;
use Nette\Utils\Json;
use Nette\Utils\JsonException;

class DefaultPresenter extends BasePresenter
{
	/** @var Connection @inject */
	public $connection;

	/** @var CollectionsMenuFactory @inject */
	public $collectionMenuFactory;

	/** @var ActionsMenuFactory @inject */
	public $actionsMenuFactory;

	/** @persistent */
	public $database = "";

	/** @persistent */
	public $collection = "";

	/** @persistent */
	public $q = "{}";

	/** @persistent */
	public $l = 1000;

	public function startup() {
		parent::startup();

		if ($this->user->isLoggedIn()) {
			try {
				$this->connection->tryConnect();
			} catch(\Exception $e) {
				$this->user->logout();
				return;
			}
		} else {
			$this->redirect("Sign:in");
		}

		try {
			Json::decode($this->q);
		} catch(JsonException $e) {
			$this->q = '{}';
		}

	}

	/**
	 * @return \DK\Menu\UI\Control
	 */
	public function createComponentCollectionsMenu() {
		return $this->collectionMenuFactory->create();
	}

	/**
	 * @return \DK\Menu\UI\Control
	 */
	public function createComponentActionsMenu() {
		$control = $this->actionsMenuFactory->create();
		$menu = $control->getMenu();

		$menu->addItem("Scheme analysis", "Default:scheme");
		$menu->addItem("Data view", "Default:view");

		return $control;
	}

	public function beforeRender()
	{
		parent::beforeRender();
		$this->template->host    = $this->connection->getHost();
		$this->template->version = $this->connection->getServerVersion();
	}

	public function actionDefault() {
		$this->redrawControl("body");
	}

	public function renderScheme() {
		$stats = $this->connection->getCollectionStats($this->database, $this->collection);

		$indexCount = count($stats->indexSizes);

		$this->template->stats = [
			'name' => $this->collection,
			'size' => Format::bytes($stats->size),
			'storageSize' => Format::bytes($stats->storageSize),
			'docs' => [
				'count'   => Format::count($stats->count),
				'avgSize' => Format::bytes($stats->avgObjSize)
			],
			'indexes' => [
				'count'     => Format::count($indexCount),
				'totalSize' => Format::bytes($stats->totalIndexSize),
				'avgSize'   => Format::bytes($stats->totalIndexSize / $indexCount),
			],
		];
	}

	public function renderView() {
		$this->renderScheme();
	}

	public function createComponentQueryForm() {
		$form = new Form();
		$form->elementPrototype->setAttribute('data-transition', '#snippet--analysis');

		$form->addText("query", "Query")
			->setDefaultValue($this->q);
		$form->addText("limit", "Limit")
			->setDefaultValue($this->l);
		$form->addSubmit("apply", "Apply");

		/**
		 * @param Form $form
		 */
		$form->onSubmit[] = function($form) {
			$values = $form->getValues(true);

			try {
				Json::decode($values['query']);
				$this->q = $values['query'];
			} catch(JsonException $e) {
				$form['query']->setValue('{}');
				$this->q = '{}';
			}

			$this->l = $values['limit'];

			$this->postGet('this');
			$this->redrawControl("analysis");
		};

		return $form;
	}
}
