<?php

namespace App\Modules\FrontModule\Security;

use MongoDB\Client;
use MongoDB\Driver\Command;
use MongoDB\Driver\Exception\AuthenticationException;
use MongoDB\Driver\Exception\ConnectionException;
use Nette\Security\IIdentity;

class DbIdentity implements IIdentity
{

	/** @var string */
	private $id;

	/** @var string */
	private $host;

	/** @var string */
	private $username;

	/** @var string */
	private $password;

	/** @var string */
	private $authDb;

	/** @var string */
	private $uri;

	/**
	 * @param string $host
	 * @param string $username
	 * @param string $password
	 * @param string $authDb
	 */
	public function __construct($host, $username, $password, $authDb)
	{
		if ($username) {
			$this->id  = sprintf("%s@%s%s", $username, $host, $authDb == "" ? "" : "/$authDb" );

			if (!$authDb) {
				$authDb = "admin";
			}
			$this->uri = sprintf("mongodb://%s:%s@%s/%s", $username, $password, $host, $authDb);
		} else {
			$this->id  = $host;
			$this->uri = sprintf("mongodb://%s", $host);
		}

		$this->host = $host;
		$this->username = $username;
		$this->password = $password;
		$this->authDb   = $authDb;
	}

	/**
	 * Returns the ID of user.
	 * @return mixed
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return string
	 */
	public function getHost() {
		return $this->host;
	}

	/**
	 * @return string
	 */
	public function getUsername() {
		return $this->username;
	}

	/**
	 * @return string
	 */
	public function getUri() {
		return $this->uri;
	}

	/**
	 * Returns a list of roles that the user is a member of.
	 * @return array
	 */
	public function getRoles()
	{
		return [];
	}

	/**
	 * @throws AuthenticationException if authentication is needed and fails
	 * @throws ConnectionException if connection to the server fails for other then authentication reasons
	 */
	public function tryConnect() {
		$client = $this->createClient();
		$client->getManager()->executeCommand("admin", new Command([ "ping" => 1 ]));
	}

	/**
	 * @return Client
	 */
	public function createClient() {
		return new Client($this->getUri(), [
			"connectTimeoutMS" => 1500,
			"appname" => "MongoEYE",
		]);
	}
}