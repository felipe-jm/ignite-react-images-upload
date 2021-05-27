import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { RegisterOptions, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

type OnSubmitParams = {
  title: string;
  description: string;
  image: string;
  url: string;
};

interface FormAddImageProps {
  closeModal: () => void;
}

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations: Record<string, RegisterOptions> = {
    image: {
      required: 'Arquivo obrigatório',
      validate: {
        lessThan10MB: (files: File[]) => {
          const [firstFile] = files;
          return (
            firstFile?.size <= 10000000 || 'O arquivo deve ser menor que 10MB'
          );
        },
        acceptedFormats: (files: File[]) => {
          const [firstFile] = files;
          if (!firstFile?.type)
            return 'Somente são aceitos arquivos PNG, JPEG e GIF';

          return (
            firstFile?.type.match(
              /([a-zA-Z0-9\s_\\.\-:])+(.png|.jpg|.jpeg)$/i
            ) || 'Somente são aceitos arquivos PNG, JPEG e GIF'
          );
        },
        messages: () => ['image'],
      },
    },
    title: {
      required: 'Título obrigatório',
      minLength: {
        value: 2,
        message: 'Mínimo de 2 caracteres',
      },
      maxLength: {
        value: 20,
        message: 'Máximo de 20 caracteres',
      },
    },
    description: {
      required: 'Descrição obrigatória',
      maxLength: {
        value: 65,
        message: 'Máximo de 65 caracteres',
      },
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (data: OnSubmitParams) => {
      const response = await api.post('api/images', data);

      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');
      },
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();

  const { errors } = formState;

  const onSubmit = async (data: OnSubmitParams): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({
          title: 'Imagem não adicionada',
          description:
            'É preciso adicionar e aguardar o upload de uma imagem antes de realizar o cadastro.',
          status: 'error',
        });
        return;
      }

      mutation.mutateAsync({ ...data, url: imageUrl });

      toast({
        title: 'Imagem cadastrada',
        description: 'Sua imagem foi cadastrada com sucesso.',
        status: 'success',
      });
    } catch {
      toast({
        title: 'Falha no cadastro',
        description: 'Ocorreu um erro ao tentar cadastrar a sua imagem.',
        status: 'error',
      });
    } finally {
      setImageUrl('');
      setLocalImageUrl('');
      reset();
      closeModal();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          name="image"
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          error={errors.image}
          {...register('image', formValidations.image)}
        />

        <TextInput
          name="title"
          placeholder="Título da imagem..."
          error={errors.title}
          {...register('title', formValidations.title)}
        />

        <TextInput
          name="description"
          placeholder="Descrição da imagem..."
          error={errors.description}
          {...register('description', formValidations.description)}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
