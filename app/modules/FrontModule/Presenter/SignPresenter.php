<?php

namespace App\Modules\FrontModule\Presenters;


use App\Modules\FrontModule\Forms\SignInFormFactory;

class SignPresenter extends BasePresenter
{
	/** @var SignInFormFactory @inject */
	public $signInFactory;

	protected function startup()
	{
		parent::startup();
		$this->redrawControl("body");
	}

	/**
	 * Sign-in form factory.
	 */
	protected function createComponentSignInForm()
	{
		$form = $this->signInFactory->create();

		$form->onSuccess[] = function() {
			$this->redirect('Default:default');
		};

		return $form;
	}

	public function actionIn()
	{
		if ($this->user->isLoggedIn()){
			$this->getUser()->logout();
			$this->redirect("in");
		}
	}

	public function actionOut()
	{
		$this->getUser()->logout();
		$this->redirect("in");
	}
}
