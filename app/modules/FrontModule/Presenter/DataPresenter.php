<?php

namespace App\Modules\FrontModule\Presenters;

use App\Modules\FrontModule\Service\Connection;
use Nette\Application\Responses\TextResponse;
use Nette\InvalidStateException;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class DataPresenter extends BasePresenter
{

	/** @var Connection @inject */
	public $connection;

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
			throw new InvalidStateException("User is not logged in.");
		}
	}

	public function actionDefault() {
		$path = __DIR__ . '/../../../resources/bin/mongoeye ';
		$host = $this->connection->getHost();
		$db  = addslashes($this->getParameter('database'));
		$col = addslashes($this->getParameter('collection'));
		$query  = addslashes($this->getParameter('q'));
		$limit = addslashes($this->getParameter('l'));

		$path .= "-u admin -p 12345 --host \"$host\" --db \"$db\" --col \"$col\" --format json --full -l $limit --query \"$query\" --max-depth 5";

		$process = new Process($path);
		$process->run();

		if (!$process->isSuccessful()) {
			throw new ProcessFailedException($process);
		}

		$output = $process->getOutput();

		$this->getHttpResponse()->setContentType('application/json');
		$this->sendResponse(new TextResponse($output));
	}
}