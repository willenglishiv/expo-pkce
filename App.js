import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { AuthSession } from 'expo';
import { Buffer } from 'buffer';
import jwtDecode from 'jwt-decode';
import uuid from 'react-native-uuid';
import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';

/*
  You need to swap out the Auth0 client id and domain with
  the one from your Auth0 client.
  In your Auth0 client, you need to also add a url to your authorized redirect urls.
  For this application, I added https://auth.expo.io/@arielweinberger/auth0-example because I am
  signed in as the "community" account on Expo and the slug for this app is "auth0-example" (check out app.json).

  You can open this app in the Expo client and check your logs to find out your redirect URL.
*/
const clientID = '';
const apiURL = __DEV__ ? 'https://testapi.fruitfulyield.com/v1' : 'https://api.fruitfulyield.com/v1';

async function createVerifierChallenge() {
  const randomBytes = await Random.getRandomBytesAsync(32);
  const verifier = base64URLEncode(Buffer.from(randomBytes));

  const challengeBase64 = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
  );

  const challenge = challengeBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  return { verifier, challenge };
}

/**
 * Converts an object to a query string.
 */
function toQueryString(params) {
  return '?' + Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function base64URLEncode(str) {
  return str
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

export default class App extends Component {
  state = {
    response: null,
  };

  login = async () => {
    // Retrieve the redirect URL, add this to the callback URL list
    // of your Auth0 application.
    const redirectUrl = AuthSession.getRedirectUrl();
    console.log(`Redirect URL: ${redirectUrl}`);

    const codeChallenge = await createVerifierChallenge();

    // Structure the auth parameters and URL
    const queryParams = toQueryString({
      client_id: clientID,
      redirect_uri: redirectUrl,
      response_type: 'code',
      state: codeChallenge.verifier,
      code_challenge: codeChallenge.challenge,
      code_challenge_method: 'S256',
      scope: 'openid offline_access', // retrieve the user's profile
      nonce: uuid.v1()
    });

    console.log(queryParams);
    const authUrl = `${apiURL}/oauth2.0/authorize` + queryParams;
    console.log(authUrl);
    // Perform the authentication
    const response = await AuthSession.startAsync({ authUrl });
    console.log('Authentication response', response);

    if (response.type === 'success') {
      this.handleResponse(response.params);
    }
  };

  handleResponse = (response) => {
    if (response.error) {
      Alert('Authentication error', response.error_description || 'something went wrong');
      return;
    }

    console.log(response);

    // Retrieve the JWT token and decode it
    // const jwtToken = response.id_token;
    // const decoded = jwtDecode(jwtToken);

    // const { name } = decoded;
    this.setState({ response });
  };

  render() {
    const { response } = this.state;
    // const redirectUri = AuthSession.getRedirectUrl();

    return (
      <View style={styles.container}>
        {
          response ?
          <>
            <View><Text>{response}</Text></View>
            <Text style={styles.title}>You are logged in</Text>
          </>
          : <Button title="Log in with Auth0" onPress={this.login} />
        }
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
  },
});
