<?php

namespace App\Modules\FrontModule\Service;


use App\Modules\FrontModule\Security\DbIdentity;
use MongoDB\Client;
use MongoDB\Driver\Command;
use MongoDB\Model\DatabaseInfoIterator;
use Nette\Database\ConnectionException;
use Nette\InvalidStateException;
use Nette\Security\AuthenticationException;
use Nette\Security\User;

class Connection
{
	/** @var User */
	private $user;

	/** @var array */
	private $collStatsCache = [];

	/**
	 * @param User $user
	 */
	public function __construct(User $user)
	{
		$this->user = $user;
	}

	/**
	 * @throws AuthenticationException if authentication is needed and fails
	 * @throws ConnectionException if connection to the server fails for other then authentication reasons
	 */
	public function tryConnect() {
		/** @var DbIdentity $identity */
		$identity = $this->user->getIdentity();
		if (!$identity) {
			throw new InvalidStateException("User is not logged in.");
		}

		$identity->tryConnect();
	}

	/**
	 * @return Client
	 */
	public function createClient() {
		/** @var DbIdentity $identity */
		$identity = $this->user->getIdentity();
		if (!$identity) {
			throw new InvalidStateException("User is not logged in.");
		}

		return $identity->createClient();
	}

	/**
	 * @return string
	 */
	public function getHost() {
		/** @var DbIdentity $identity */
		$identity = $this->user->getIdentity();
		if (!$identity) {
			throw new InvalidStateException("User is not logged in.");
		}

		return $identity->getId();
	}

	/**
	 * @return string
	 */
	public function getServerVersion() {
		$buildInfo = $this
			->createClient()
			->getManager()
			->executeCommand("admin", new Command([
				"buildInfo" => 1,
			]));
		return $buildInfo->toArray()[0]->version;
	}

	/**
	 * @return DatabaseInfoIterator
	 */
	public function listDatabases() {
		return $this->createClient()->listDatabases();
	}

	/**
	 * @param string $db
	 * @return \MongoDB\Model\CollectionInfoIterator
	 */
	public function listCollections($db) {
		return $this
			->createClient()
			->selectDatabase($db)
			->listCollections();
	}

	/**
	 * @param string $db
	 * @param string $col
	 * @return \stdClass
	 */
	public function getCollectionStats($db, $col) {
		$cacheKey = $db . '+' . $col;
		if (!isset($this->collStatsCache[$cacheKey])) {
			$result = $this
				->createClient()
				->getManager()
				->executeCommand($db, new Command([
					"collStats" => $col,
				]));

			$this->collStatsCache[$cacheKey] = $result->toArray()[0];
		}

		return $this->collStatsCache[$cacheKey];
	}
}