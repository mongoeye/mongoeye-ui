<?php

namespace App\Modules\FrontModule\Forms;

use App\Modules\FrontModule\Security\DbIdentity;
use Nette;
use Nette\Security\User;

class SignInFormFactory
{
	use Nette\SmartObject;

	/** @var FormFactory */
	private $factory;

	/** @var User */
	private $user;

	public function __construct(FormFactory $factory, User $user)
	{
		$this->factory = $factory;
		$this->user = $user;
	}

	public function create()
	{
		$form = $this->factory->create();

		// When signing out, identity is not removed
		/** @var DbIdentity $identity */
		$identity = $this->user->getStorage()->getIdentity();

		// Default host
		$defaultHost = "localhost:27017";
		if ($identity) {
			$defaultHost = $identity->getHost();
		}

		// Default user
		$defaultUser = "";
		if ($identity) {
			$defaultUser = $identity->getUsername();
		}

		$form->addText('host', 'MongoDB host')
			->setRequired('Please enter the host.')
			->setDefaultValue($defaultHost);

		$form->addText('username', 'Username')
			->setAttribute('placeholder', 'admin')
			->setDefaultValue($defaultUser == "admin" ? "" : $defaultUser);

		$form->addPassword('password', 'Password');

		$form->addText('authDb', 'Auth db')
			->setAttribute('placeholder', 'admin');

		$form->addSubmit('send', 'Connect');

		$form->onSuccess[] = function (Nette\Application\UI\Form $form, $values) {
			try {
				$this->user->login($values->host, $values->username, $values->password, $values->authDb);
			} catch (Nette\Security\AuthenticationException $e) {
				$form->addError($e->getMessage());
				return;
			}
		};

		return $form;
	}
}