<?php

namespace App\Modules\CommonModule\Presenters;

use Nittro\Bridges\NittroUI;

abstract class BasePresenter extends NittroUI\Presenter
{
	/** @var string */
	protected $title = 'mongoeye';

	protected function afterRender() {
		parent::afterRender();

		if ($this->isAjax()) {
			$this->payload->title = $this->title;
		}

		$this->template->title = $this->title;
	}
}
