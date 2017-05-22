<?php

namespace App\Modules\FrontModule\Service;

use App\Modules\FrontModule\Security\DbIdentity;
use MongoDB\Client;
use MongoDB\Driver\Command;
use MongoDB\Driver\Exception\ConnectionTimeoutException;
use Nette\Security\AuthenticationException;
use Nette\Security\IAuthenticator;
use Nette\Security\IIdentity;

class Authenticator implements IAuthenticator
{
	/**
	 * @param array $credentials
	 * @return DbIdentity
	 * @throws AuthenticationException
	 */
	function authenticate(array $credentials)
	{
		list($host, $username, $password, $authDb) = $credentials;
		$identity = new DbIdentity($host, $username, $password, $authDb);

		try {
			$identity->tryConnect();
		} catch(ConnectionTimeoutException $e) {
			throw new AuthenticationException("Can not connect to the specified host.");
		} catch(\MongoDB\Driver\Exception\AuthenticationException $e) {
			throw new AuthenticationException("Authentication failed.");
		}

		return $identity;
	}
}