import { AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import mime from 'mime';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { Camera } from '../../components/camera';
import { GreenButton } from '../../components/greenButton';
import { Loading } from '../../components/loading';
import { NumericUpDown } from '../../components/numericUpDown';
import { SafeZoneScreen } from '../../components/safeZoneScreen';
import { CustomTextInput } from '../../components/textInput';
import { DateHelper } from '../../helpers/DateHelper';
import api from '../../services/api';
import ocr from '../../services/ocr';
import { Purchase } from '../../storage/Purchase';
import { IProductDto } from './IProductDto';
import { IProductModel } from './IProductModel';
import styles from './styles';

export function Product() {
  async function handleContinue() {
    product!.barcode = routeParams.barcode;
    product!.validate = validate;
    product!.amount = amount;

    await Purchase.addProduct(product!);

    navigator.navigate('BarcodeScan' as never);
  }

  function handleValidate(uri: string) {
    setCameraVisible(false);

    let newImageUri = 'file:///' + uri.split('file:/').join('');

    let formData = new FormData();
    formData.append(
      'image',
      JSON.parse(JSON.stringify({
        uri: newImageUri,
        type: mime.getType(newImageUri),
        name: newImageUri.split('/').pop()
      }))
    );

    getValidate(formData);
  }

  async function getValidate(formData: FormData) {
    try {
      let response = await ocr.post(
        '/ocr/validate',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      let data: any = response.data;
      let status = response.status;

      if (status === 200 && data.length > 0) {
        setValidate(DateHelper.convertFromStoreToViewFormat(data));
      } else if (status === 400) {
        Alert.alert('Erro', data.error.join('\n'));
      } else {
        Alert.alert('Erro', 'Validade não pode ser extraída.');
      }
    } catch {
      Alert.alert('Erro', 'Erro inesperado.');
    }
  }

  let [cameraVisible, setCameraVisible] = useState<boolean>(false);
  let [product, setProduct] = useState<IProductModel>();
  let [amount, setAmount] = useState<number>(0);
  let [validate, setValidate] = useState<string>('');
  let [isLoading, setIsLoading] = useState<boolean>(true);
  let navigator = useNavigation();
  let route = useRoute();
  let routeParams = route.params
    ? route.params as IProductDto
    : { barcode: '7891079013458' };
  // : { barcode: '7896213002138' };

  useEffect(() => {
    async function loadData() {
      setCameraVisible(false);
      setAmount(0);
      setValidate('');
      setIsLoading(true);

      let localResponse = await Purchase.findProductByBarcode(routeParams.barcode);
      let productFound = localResponse;

      if (productFound) {
        setValidate(productFound.validate);
        setAmount(productFound.amount);

        Alert.prompt('Encontrei localmente');
      } else {
        let apiResponse = await api.get(`/products/barcode/${routeParams.barcode}`);
        productFound = apiResponse.data as IProductModel;

        Alert.prompt('Encontrei remotamente');
      }

      setProduct(productFound);
      setIsLoading(false);
    }

    loadData().catch(error => console.log(error));
  }, [route.params]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeZoneScreen>
      {
        cameraVisible
          ? <Camera handleImg={handleValidate} />
          : <>
            <View style={styles.amountContainer}>
              <Text style={styles.productName}>{product?.name}</Text>

              <Image style={styles.image} source={require('../../../assets/logo.png')} />

              <NumericUpDown
                style={styles.upDown}
                value={amount}
                onDown={() => setAmount(--amount)}
                onUp={() => setAmount(++amount)}
              />
            </View>

            <CustomTextInput
              style={styles.validate}
              label='Data de validade'
              defaultValue={validate}
              placeholder='xx/xx/xxxx'
              maxLength={10}
              rightIcon={<AntDesign
                style={styles.icon}
                name='camera'
                size={24}
                color='#5A6CF3'
                onPress={() => setCameraVisible(true)}
              />}
            />

            <GreenButton style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonContent}>Continuar</Text>
            </GreenButton>
          </>
      }
    </SafeZoneScreen>
  );
}
