// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

(function(){
  var removeDomainLevels = 2;

  var ipfsBaseUrl = 'https://ipfs.infura.io/ipfs/';

  /* mainnet */
  var rpcHost = 'https://mainnet.infura.io/v3/<PROJECT_ID>';
  var registry = '0x314159265dd8dbb310642f98f50c066173c1259b'; // mainnet

  /* ropsten */
  //var rpcHost = 'https://ropsten.infura.io/v3/<PROJECT_ID>';
  //var registry = '0x112234455c3a32fd11230c42e7bccd4a84e02010'; // ropsten

  /* get the hostname from location.hostname by remoming the last parts and by adding '.eth' */
  var hostname = window.location.hostname;
  var hostnameParts = hostname.split('.');
  for (var i=0; i < removeDomainLevels ; i++){
    hostnameParts.pop();
  }
  var hostnameENS = hostnameParts.join('.') + '.eth';

  /* show which domain we are resolving */
  document.getElementById('d-text').textContent = 'Redirect to "' + hostnameENS + '"';
  
  /* now calculate the hash of the domain which is then send to our ethereum rpc provider */
  var ethEnsNamehash = window.ethEnsNamehash;
  var nameHash = ethEnsNamehash.hash(hostnameENS);

  /*
    dots:
        #0: dummy
        #1: lookupResolver
        #2: lookupContenthash
  */
  var dotShow = function(){
    document.getElementById('d-dot').style.display = 'block';
  };
  var errorDisplayed = null;
  var dotSet = function(dotNr, error){
    document.getElementById('d-dot' + dotNr).setAttribute('fill', error? '#ff0000' : '#b3e0f2');
    if (error && (! errorDisplayed)){
      // we are only displaying the first error
      errorDisplayed = error;
      var text = document.getElementById('d-text');
      text.textContent = errorDisplayed;
      text.setAttribute('fill', '#ff0000');
    }
  };
  var dotCurrent = 0;
  var dotState = [];
  var dotSetInOrder = function(dotNr, error){
    dotState[dotNr] = error;

    while (typeof(dotState[dotCurrent]) !== 'undefined'){
      dotSet(dotCurrent, dotState[dotCurrent]);
      dotCurrent ++;
    }

    try{
      if (error){
        if (window.console){
          window.console.log(error);
        }
        //sendError('Error: '+ error);
      }
    } catch (e){/*empty*/}
  };

  var removePrefix = function(hex){
    if (hex.substr(0, 2) === '0x')
      return hex.substr(2);
    return hex;
  };

  var requestPostJson = function(url, data, done){
    var xhr = new XMLHttpRequest();   // new HttpRequest instance
    xhr.onreadystatechange = function() {
      if (this.readyState == 4){
        var response;
        if (this.status == 200) {
          try {
            response = JSON.parse(this.responseText);
          } catch (err){
            done(err);
            return;
          }
          var result = response.result;

          if (! result){
            done('Geth request failed');
            return;
          }

          if (result.length <= 2){
            done('Invalid response');
            return;
          }

          done(null, result);
        } else {
          try {
            response = JSON.parse(this.responseText);
          } catch (err){
            //
          }
          if (response.error && response.error.message){
            done(response.error.message);
            return;
          }
          done('retured status code ' + this.status);
        }
      }
    };
    xhr.onerror = function () {
      done(xhr.response);
    };
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
    xhr.send(JSON.stringify(data));
  };

  var lookupResolver = function(host, nameHash, registry, done){
    var dataGetResolver = {
      'id': 0,
      'jsonrpc': '2.0',
      'params': [
        {
          'to': registry,
          // '0x0178b8bf' = 'resolver(bytes32)' (see https://www.4byte.directory/)
          'data': '0x0178b8bf' + removePrefix(nameHash)
        },
        'latest'
      ],
      'method': 'eth_call'
    };
    requestPostJson(host, dataGetResolver, function(err, result){
      if (err){
        done(err);
        return;
      }
      result = removePrefix(result);
      var resolver = '0x' + result.substr(24);
      done((resolver === '0x0000000000000000000000000000000000000000')? 'invalid resolver' : null, resolver);
    });
  };

  var lookupContenthash = function(host, nameHash, resolver, done){

    var dataGetContentHash = {
      'id': 1,
      'jsonrpc': '2.0',
      'params': [
        {
          'to': resolver,
          // "0x3b3b57de" = "addr(bytes32)" (see https://www.4byte.directory/) // works for ethereum.eth (resolver: 0x1da022710df5002339274aadee8d58218e9d6ab5)
          // "0x2dff6941" = "content(bytes32)" (see https://www.4byte.directory/) // works for portalnetwork.eth (resolver: 0x1da022710df5002339274aadee8d58218e9d6ab5)
          // "0xbc1c58d1" = "contenthash(bytes32)"
          'data': '0xbc1c58d1' + removePrefix(nameHash)
        },
        'latest'
      ],
      'method': 'eth_call'
    };
    requestPostJson(host, dataGetContentHash, function(err, result){
      if (err){
        done(err);
        return;
      }
      result = removePrefix(result);
      var contentHash = result.substr(32); // TODO
      contentHash = contentHash.substr(32); // TODO
      var length = contentHash.substr(0, 64); // TODO
      var lengthInt = parseInt(length, 16);
      if (lengthInt === 0){
        done('invalid length');
        return;
      }
      contentHash = contentHash.substr(64).substr(0, lengthInt*2); // TODO
      done(null, contentHash);
    });
  };
  var contenthashToCID = function(contenthash){
    // first byte should be 'e3' for ipfs, then '01' - add 'f' to sign hex codes cid
    return 'f' + contenthash.substr(4);
  };

  dotShow(); // signal that js started to execute
  dotSetInOrder(0, null);

  lookupResolver(rpcHost, nameHash, registry, function(err, resolver){
    dotSetInOrder(1, err? 'Error: Resolver lookup failed: ' + err : null);
    if (err){
      return;
    }
    lookupContenthash(rpcHost, nameHash, resolver, function(err, contenthash){
      dotSetInOrder(2, err? 'Error: Contenthash lookup failed: ' + err : null);
      if (err){
        return;
      }
      var cid = contenthashToCID(contenthash);
      window.location.replace(ipfsBaseUrl + cid + location.pathname);
    });
  });
})();
