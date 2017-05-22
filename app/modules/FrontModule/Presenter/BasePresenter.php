<?php

namespace App\Modules\FrontModule\Presenters;

use App\Modules\CommonModule;

use App\Modules\FrontModule\Control\Menu\MenuFactory;
use App\Modules\FrontModule\Security\DbIdentity;
use Kdyby\Translation\Translator;
use Nette\Neon\Exception;

class BasePresenter extends CommonModule\Presenters\BasePresenter
{
	/** @var Translator @inject */
	public $translator;

	protected function startup() {
		parent::startup();
		$this->setDefaultSnippets(['header', 'sidebar', 'main']);
	}

	public function beforeRender() {
		 $this->template->locale = $this->translator->getLocale();
	}
}
